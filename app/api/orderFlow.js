import axiosInstance from "../../config/axiosConfig";

// ✅ Exportable function to accept order
export const AcceptOrderApi = async (orderId) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/acceptOrder", {
      orderId,
    });
    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error in AcceptOrderApi:", error.response?.data || error.message);
    throw error;
  }
};

export const ReachPickUpLocation = async ({ orderId, coordinates }) => {
console.log('reachedPickupLocation');

  try {
    const { lat, lng } = coordinates;
    const latitude  =  lat
    const longitude = lng
    const response = await axiosInstance.post(
      "deliveryRider/order/reachedPickupLocation",
      {
        orderId,
        latitude,
        longitude,
      }
    );
    console.log("📨 ReachPickup log sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error in ReachPickUpLocation:", error.response?.data || error.message);
    throw error;
  }
};

export const VerifyPickupOtp = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/VerifyPickupOtp", {
      orderId,
      otp,
    });

    console.log("✅ OTP Verified:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error verifying OTP:", error.response?.data || error.message);
    throw error;
  }
};
