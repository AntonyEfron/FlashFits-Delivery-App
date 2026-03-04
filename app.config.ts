// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        // BACKEND_URL:"https://662e0239d03e.ngrok-free.app", // change to your backend URL
        BACKEND_URL:"http://192.168.29.230:5000", // change to your backend URL
      },
    };
  };  