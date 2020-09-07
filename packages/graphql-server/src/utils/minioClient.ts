import {Client} from 'minio';
import {URL} from 'url';

export const createMinioClient = (endpoint: string, accessKey: string, secretKey: string) => {
    const url = new URL(endpoint);
    let port = 80;
    if (url.port === 'http') {
    port = 80;
    } else if (url.port === 'https') {
    port = 443;
    } else {
    port = parseInt(url.port, 10);
    }

    const useSSL = (url.protocol === 'https');

    const minioClient = new Client({
        endPoint: url.hostname,
        port,
        useSSL,
        accessKey,
        secretKey
    });
    return minioClient;
};
