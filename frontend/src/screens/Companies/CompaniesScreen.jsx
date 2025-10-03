import React from "react";
import Card from "../../components/Card";
import GenericScreen from "../../components/GenericScreen";
import { getCompanies } from "../../services/api";

export default function CompaniesScreen({ apiCall = getCompanies }) {
  return (
    <GenericScreen
      apiCall={apiCall}
      titleKey="Partner Companies"
      emptyKey="No companies available"
      errorKey="Could not load companies"
    >
      {(companies) => (
        <div>
          {companies.map((company) => (
            <Card key={company.id} title={company.name} variant="light" hoverable>
              <p>{company.icon} {company.name}</p>
            </Card>
          ))}
        </div>
      )}
    </GenericScreen>
  );
}