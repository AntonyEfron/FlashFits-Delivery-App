// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://47270b34f35c.ngrok-free.app", // change to your backend URL
      },
    };
  };
 