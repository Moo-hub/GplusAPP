import { getCompanies } from "../../services/api";

export default function CompaniesScreen(props) {
  return (
    <GenericScreen
      apiCall={getCompanies}
      titleKey="companies"
      emptyKey="no_companies_found"
      {...props}
      renderItem={item => item.name}
    />
  );
}


