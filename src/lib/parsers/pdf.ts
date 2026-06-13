import { PDFParse } from 'pdf-parse';

/**
 * Parses a PDF buffer and extracts plain text.
 * @param buffer - The file buffer.
 * @returns Plain text content of the PDF.
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    return textResult.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF document. Ensure the file is not corrupted.');
  }
}
