// custom modules
import config from './config';
import serviceLoader from './service-loader';

/**
 * Verify API Key
 * @param accessType
 * @param apiKeyHeader
 * @param ip
 * @param tenantQS (tenant queryString)
 */
const verifyApiKey = (
  accessType: 'read' | 'write',
  apiKeyHeader?: string,
  ip?: string,
  tenantQS?: string,
): { tenant: string; mailTo: string } => {
  const { apiKeyAdmin, defaultMailTo } = config;
  const services = serviceLoader.load();

  if (!services.length) throw 'Setup Incomplete';
  if (!apiKeyHeader || !ip) throw 'Access Denied';

  // if using master-key
  if (apiKeyHeader === apiKeyAdmin) {
    const service = services.find(service => service.tenant === tenantQS);
    if (service) return { tenant: service.tenant, mailTo: defaultMailTo };

    throw 'Invalid Domain';
  }

  const service = services.find(service => service[accessType].apiKey === apiKeyHeader);

  // if no api-key matches
  if (!service) throw 'Access Denied';

  // check valid remote-IP
  if (!service[accessType].ips.includes('0.0.0.0') && !service[accessType].ips.includes(ip)) throw 'Access Denied (IP)';

  return { tenant: service.tenant, mailTo: service.mailTo };
};

export { verifyApiKey };
