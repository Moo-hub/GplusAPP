import React from "react";
import Card from "../../components/Card";
import GenericScreen from "../../components/GenericScreen";
import { getCompanies } from "../../api/companies";

export default function CompaniesScreen() {
  return (
    <GenericScreen
      apiCall={getCompanies}
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