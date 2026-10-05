// Board ids are 8 characters: letters, digits, "-" and "_". Same rule as the API.
const BOARD_ID_PATTERN = /^[A-Za-z0-9_-]{8}$/

export const isValidBoardId = (id: string): boolean => BOARD_ID_PATTERN.test(id)
