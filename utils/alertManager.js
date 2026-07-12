import { Vibration } from 'react-native';
import { Audio } from 'expo-av';

let alertSound = null;
let isAlerting = false;

// We use a looping vibration pattern: [wait, vibrate, wait, vibrate...]
// 1000ms wait, 2000ms vibrate
const VIBRATION_PATTERN = [0, 2000, 1000];

export const playOrderAlert = async () => {
  if (isAlerting) return;
  isAlerting = true;

  try {
    // Start aggressive looping vibration
    Vibration.vibrate(VIBRATION_PATTERN, true);

    // Play alert sound
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
      { shouldPlay: true, isLooping: true }
    );
    alertSound = sound;
  } catch (error) {
    console.error("Error playing order alert sound:", error);
  }
};

export const stopOrderAlert = async () => {
  if (!isAlerting) return;
  isAlerting = false;

  try {
    // Stop vibration
    Vibration.cancel();

    // Stop and unload sound
    if (alertSound) {
      await alertSound.stopAsync();
      await alertSound.unloadAsync();
      alertSound = null;
    }
  } catch (error) {
    console.error("Error stopping order alert:", error);
  }
};
