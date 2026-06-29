module.exports = {
  apps: [
    {
      name: "gl-dx-backend",
      cwd: "/home/ubuntu/GL-DX/backend",
      script: "venv/bin/python",
      args: "-m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      interpreter: "none",
      env: { ENVIRONMENT: "production" },
    },
    {
      name: "gl-dx-frontend",
      cwd: "/home/ubuntu/GL-DX/frontend",
      script: "npm",
      args: "start",
      env: { PORT: "3000", NODE_ENV: "production" },
    },
  ],
};
