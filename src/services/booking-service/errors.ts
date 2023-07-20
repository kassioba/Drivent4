import { ApplicationError } from '@/protocols';

export function forbiddenError(): ApplicationError {
  return {
    name: 'forbiddenError',
    message: "You don't have permission to access this resource",
  };
}
