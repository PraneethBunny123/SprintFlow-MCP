# SprintFlow-MCP

# Morning / after reboot
npm run docker:up

# After changing src/index.ts
npm run build

# verify in psql
npm run docker:psql
SELECT * FROM projects;

# After changing schema
npm run db:generate
npm run db:migrate