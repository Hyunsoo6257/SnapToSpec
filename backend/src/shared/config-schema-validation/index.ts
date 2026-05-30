import * as Joi from 'joi';

export default abstract class ConfigSchemaValidation {
  static get validationSchema(): Joi.ObjectSchema {
    return Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production')
        .default('development'),
      APPLICATION_PORT: Joi.number().default(3000),
      PROJECT_NAME: Joi.string().required(),
      ANTHROPIC_API_KEY: Joi.string().required(),
      SUPABASE_URL: Joi.string().uri().required(),
      SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
      ALLOWED_CORS_ORIGIN: Joi.string().required(),
      FRONTEND_BASE_URL: Joi.string().uri().required(),
      DATABASE_URL: Joi.string().optional(),
    });
  }
}
