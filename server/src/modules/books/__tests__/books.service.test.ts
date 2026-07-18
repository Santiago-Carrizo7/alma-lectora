import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BooksService } from '../books.service.js';
import { lookupBookSchema } from '../books.schemas.js';

describe('Books Service & Schema Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Zod ISBN Validation Schema', () => {
    it('should validate and normalize a valid ISBN-13 with hyphens', () => {
      const result = lookupBookSchema.safeParse({ isbn: '978-0-14-032872-1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn).toBe('9780140328721');
      }
    });

    it('should validate a valid ISBN-10 with spaces and an X check digit', () => {
      const result = lookupBookSchema.safeParse({ isbn: '0 1403 2872 X' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn).toBe('014032872X');
      }
    });

    it('should reject invalid ISBN formats', () => {
      const result1 = lookupBookSchema.safeParse({ isbn: '12345' });
      const result2 = lookupBookSchema.safeParse({ isbn: '978-01403287212' }); // Too long
      const result3 = lookupBookSchema.safeParse({ isbn: '978-014032872A' }); // Invalid character

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);
    });
  });

  describe('BooksService.lookupBook', () => {
    it('should fetch and normalize data from Google Books API successfully without calling Open Library', async () => {
      const mockGoogleResponse = {
        items: [
          {
            id: 'google-id-123',
            volumeInfo: {
              title: 'Test Google Book',
              authors: ['Google Author A', 'Google Author B'],
              description: 'Google Synopsis',
              imageLinks: {
                thumbnail: 'http://books.google.com/thumbnail.jpg',
              },
              publishedDate: '2023-01-01',
              language: 'es',
            },
          },
        ],
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockGoogleResponse,
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await BooksService.lookupBook('9780140328721');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('https://www.googleapis.com/books/v1/volumes?q=isbn:9780140328721&fields=items(id%2CvolumeInfo(title%2Cauthors%2Cdescription%2CimageLinks%2CpublishedDate%2Clanguage))');
      expect(result).toEqual({
        title: 'Test Google Book',
        originalTitle: 'Test Google Book',
        googleBooksId: 'google-id-123',
        authors: ['Google Author A', 'Google Author B'],
        synopsis: 'Google Synopsis',
        coverUrl: 'https://books.google.com/thumbnail.jpg',
        publishedDate: '2023-01-01',
        language: 'es',
      });
    });

    it('should fallback to Open Library API when Google Books API returns no items', async () => {
      const mockGoogleResponse = { totalItems: 0 };
      const mockOpenLibraryResponse = {
        'ISBN:9780140328721': {
          title: 'Test Open Library Book',
          authors: [{ name: 'OL Author' }],
          notes: 'OL Notes/Synopsis',
          publish_date: '2022',
          cover: {
            medium: 'http://covers.openlibrary.org/medium.jpg',
          },
        },
      };

      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOpenLibraryResponse,
        });
      vi.stubGlobal('fetch', fetchMock);

      const result = await BooksService.lookupBook('9780140328721');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        title: 'Test Open Library Book',
        originalTitle: 'Test Open Library Book',
        googleBooksId: null,
        authors: ['OL Author'],
        synopsis: 'OL Notes/Synopsis',
        coverUrl: 'https://covers.openlibrary.org/medium.jpg',
        publishedDate: '2022',
        language: null,
      });
    });

    it('should fallback to Open Library API when Google Books API fails with a network/server error', async () => {
      const mockOpenLibraryResponse = {
        'ISBN:9780140328721': {
          title: 'Test Open Library Book',
          authors: [{ name: 'OL Author' }],
          notes: 'OL Notes/Synopsis',
          publish_date: '2022',
          cover: {
            large: 'http://covers.openlibrary.org/large.jpg',
          },
        },
      };

      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error('Network error on Google API'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOpenLibraryResponse,
        });
      vi.stubGlobal('fetch', fetchMock);

      const result = await BooksService.lookupBook('9780140328721');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        title: 'Test Open Library Book',
        originalTitle: 'Test Open Library Book',
        googleBooksId: null,
        authors: ['OL Author'],
        synopsis: 'OL Notes/Synopsis',
        coverUrl: 'https://covers.openlibrary.org/large.jpg',
        publishedDate: '2022',
        language: null,
      });
    });

    it('should return null metadata gracefully (Graceful Failure) if both APIs fail or return no results', async () => {
      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error('Google Down'))
        .mockRejectedValueOnce(new Error('Open Library Down'));
      vi.stubGlobal('fetch', fetchMock);

      const result = await BooksService.lookupBook('9780140328721');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        title: null,
        originalTitle: null,
        googleBooksId: null,
        authors: [],
        synopsis: null,
        coverUrl: null,
        publishedDate: null,
        language: null,
      });
    });
  });
});
