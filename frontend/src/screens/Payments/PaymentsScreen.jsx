import React from "react";
import Card from "../../components/Card";
import GenericScreen from "../../components/GenericScreen";
import { getPaymentMethods } from "../../api/payments";

export default function PaymentsScreen() {
  return (
    <GenericScreen
      apiCall={getPaymentMethods}
      titleKey="Payment Methods"
      emptyKey="No payment methods available"
      errorKey="Could not load payment methods"
    >
      {(methods) => (
        <div>
          {methods.map((method) => (
            <Card key={method.id} title={method.name} variant="light" hoverable>
              <p>{method.icon} {method.name}</p>
            </Card>
          ))}
        </div>
      )}
    </GenericScreen>
  );
}