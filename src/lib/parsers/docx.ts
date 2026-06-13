import mammoth from 'mammoth';

/**
 * Parses a DOCX buffer and extracts plain text.
 * @param buffer - The file buffer.
 * @returns Plain text content of the DOCX.
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse Word document. Ensure the file is not corrupted.');
  }
}
