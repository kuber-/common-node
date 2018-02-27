import { Errors } from 'moleculer'

export const createError = (message, code, type, data) => {
  const error = new Error(message)
  error.code = code
  error.type = type
  error.data = data
  return error
}

export const createApiError = (type, message, data) => {
  return new Errors.MoleculerClientError(message, 422, type, data)
}

export const createApiValidationError = (message, data) => {
  return new Errors.ValidationError(message, 'validation_error', data)
}
