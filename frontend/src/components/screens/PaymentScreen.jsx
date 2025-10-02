import { getPaymentMethods } from "../../services/api";
import GenericScreen from "../../components/GenericScreen";

export default function PaymentScreen(props) {
  return (
    <GenericScreen
      apiCall={getPaymentMethods}
      titleKey="payments"
      emptyKey="no_payments_found"
      {...props}
      renderItem={item => item.name || item}
    />
  );
}


