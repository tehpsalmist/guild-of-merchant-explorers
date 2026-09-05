export const getGraphqlErrorMessage = (error: unknown): string | undefined => {
  const first: unknown = Array.isArray(error) ? error[0] : error
  if (first && typeof first === 'object' && 'message' in first && typeof first.message === 'string') {
    return first.message
  }
  return undefined
}
