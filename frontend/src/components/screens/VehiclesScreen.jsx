import React from 'react';
import { getVehicles } from "../../services/api";
import GenericScreen from "../../components/GenericScreen";

export default function VehiclesScreen(props) {
  return (
    <GenericScreen
      apiCall={getVehicles}
      titleKey="vehicles"
      emptyKey="no_vehicles_found"
      {...props}
      renderItem={(item) => (
        <>
          <span data-testid="item-name">{item?.name ?? ''}</span>{' '}
          (<span data-testid="item-location">{item?.location ?? ''}</span>) -{' '}
          <span data-testid="item-price">{item?.price ?? ''}</span>{' '}
          <span data-testid="item-balance" style={{ display: 'none' }}>{item?.balance ?? ''}</span>
          <span data-testid="item-rewards" style={{ display: 'none' }}>{Array.isArray(item?.rewards) ? item.rewards.join(', ') : ''}</span>
        </>
      )}
    />
  );
}


