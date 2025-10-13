// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://55a299101e7c.ngrok-free.app", // change to your backend URL
      },
    };
  };
 