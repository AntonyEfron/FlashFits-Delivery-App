    import axiosInstance from "../../config/axiosConfig";


    export const verifyPhoneOtp = async (phone,otp) => {
        try {
            console.log('87878787');
            const response = await axiosInstance.post("/deliveryRider/auth/verify-otp", {phone, otp });
            console.log(response.data);
            return response;
        } catch (error) {
            throw error;
        }
    };

    
    // getUser
    export const getRider = async () => {
        try {
            const response = await axiosInstance.get("/deliveryRider/getRiderById");
            console.log(response.data);
            return response;
        } catch (error) {
            throw error;
        }
    };
