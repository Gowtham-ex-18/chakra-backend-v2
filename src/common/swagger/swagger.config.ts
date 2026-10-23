import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: 'Chakra Api Documentation',
  description: 'Production-ready APIs for Chakra Backend Application.',
  version: '1.0',
  path: 'api/docs',
}));