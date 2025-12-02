// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://da7e257ae258.ngrok-free.app", // change to your backend URL
      },
    };
  };