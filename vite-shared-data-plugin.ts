import type { Plugin } from 'vite';
import {
  getClients, saveClients, getTrialApplications, saveTrialApplications,
  getServerAdmins, saveServerAdmins, getNotifications, saveNotifications,
  addClient, updateClient, deleteClient, addTrialApplication,
  updateTrialApplication, addNotification, markNotificationAsRead,
  getSharedEmployees, addSharedEmployee, updateSharedEmployee, deleteSharedEmployee,
  type Client, type TrialApplication, type Notification, type SharedEmployee
} from './shared-data';

export function sharedDataPlugin(): Plugin {
  return {
    name: 'shared-data-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        next();
      });

      server.middlewares.use('/api/shared/clients', (req, res) => {
        try {
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: getClients() }));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const data = JSON.parse(body);
              if (Array.isArray(data)) {
                saveClients(data as Client[]);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data }));
              } else {
                const client = data as Client;
                addClient(client);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: client }));
              }
            });
          } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const { id, ...updates } = JSON.parse(body) as { id: string } & Partial<Client>;
              updateClient(id, updates);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            });
          } else if (req.method === 'DELETE') {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const id = url.searchParams.get('id');
            if (id) {
              deleteClient(id);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(405);
            res.end();
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (error as Error).message }));
        }
      });

      server.middlewares.use('/api/shared/trial-applications', (req, res) => {
        try {
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: getTrialApplications() }));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const app = JSON.parse(body) as TrialApplication;
              addTrialApplication(app);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, data: app }));
            });
          } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const { id, ...updates } = JSON.parse(body) as { id: string } & Partial<TrialApplication>;
              updateTrialApplication(id, updates);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            });
          } else {
            res.writeHead(405);
            res.end();
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (error as Error).message }));
        }
      });

      server.middlewares.use('/api/shared/notifications', (req, res) => {
        try {
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: getNotifications() }));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const notification = JSON.parse(body) as Notification;
              addNotification(notification);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, data: notification }));
            });
          } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const { id } = JSON.parse(body) as { id: string };
              markNotificationAsRead(id);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            });
          } else {
            res.writeHead(405);
            res.end();
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (error as Error).message }));
        }
      });

      server.middlewares.use('/api/shared/admins', (req, res) => {
        try {
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: getServerAdmins() }));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const admins = JSON.parse(body);
              saveServerAdmins(admins);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            });
          } else {
            res.writeHead(405);
            res.end();
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (error as Error).message }));
        }
      });

      server.middlewares.use('/api/shared/employees', (req, res) => {
        try {
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: getSharedEmployees() }));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const employee = JSON.parse(body) as SharedEmployee;
              addSharedEmployee(employee);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, data: employee }));
            });
          } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const { key, ...updates } = JSON.parse(body) as { key: string } & Partial<SharedEmployee>;
              updateSharedEmployee(key, updates);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            });
          } else if (req.method === 'DELETE') {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const key = url.searchParams.get('key');
            if (key) {
              deleteSharedEmployee(key);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(405);
            res.end();
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (error as Error).message }));
        }
      });
    }
  };
}