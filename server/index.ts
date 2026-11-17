import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { MariaDbRepository } from './mariadb-repository.js';
import { createNotificationTransport } from './notifications.js';
import { InMemoryRepository } from './repository.js';

const config = loadConfig();
const repository = config.REPOSITORY === 'memory' ? new InMemoryRepository() : MariaDbRepository.fromConfig(config);
const app = createApp({ repository, config, notifications: createNotificationTransport(config) });

const server = app.listen(config.API_PORT, '0.0.0.0', () => console.log(`robweb API listening on :${config.API_PORT}`));

const close = () => server.close(async () => {
  if (repository instanceof MariaDbRepository) await repository.close();
  process.exit(0);
});
process.on('SIGTERM', close);
process.on('SIGINT', close);
