export class CreateShortUrlDto {
  expirationTime?: number | null;
  url: string;
  shortUrl: string;
}
