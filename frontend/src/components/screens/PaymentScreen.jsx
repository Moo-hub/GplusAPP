import React from "react";
import GenericScreen from "../GenericScreen";
import { getPaymentMethods } from "../../services/api";

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
