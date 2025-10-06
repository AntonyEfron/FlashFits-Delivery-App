import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Modalize } from 'react-native-modalize';

interface AcceptOrderProps {
  onNext: () => void;
}

const AcceptOrder: React.FC<AcceptOrderProps> = ({ onNext }) => {
  const modalRef = useRef<Modalize>(null);

  useEffect(() => {
    const timer = setTimeout(() => modalRef.current?.open(), 100); // open modal after mount
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modalize
      ref={modalRef}
      modalHeight={300} // approximate height for your content
      handleStyle={{ backgroundColor: '#ccc' }}
      overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        closeOnOverlayTap={false}   // Prevent closing on tap outside
        panGestureEnabled={false}   // Disable dragging down to close
        disableScrollIfPossible={true} // Disable scroll if not needed
        withHandle={true} 
    >
      <View style={styles.container}>
        <Text style={styles.title}>New Order Request</Text>
        <Text style={styles.info}>Pickup: ABC Restaurant, MG Road</Text>
        <Text style={styles.info}>Delivery Amount: ₹120</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            modalRef.current?.close();
            onNext();
          }}
        >
          <Text style={styles.buttonText}>Accept Order</Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 10 },
  button: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});

export default AcceptOrder;
