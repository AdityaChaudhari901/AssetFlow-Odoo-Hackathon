import { Building2, Shapes, UsersRound } from "lucide-react";
import { useSearchParams } from "react-router";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesPanel } from "@/features/organization/components/categories-panel";
import { DepartmentsPanel } from "@/features/organization/components/departments-panel";
import { EmployeesPanel } from "@/features/organization/components/employees-panel";

const TABS = new Set(["departments", "categories", "employees"]);

export function OrganizationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.has(requestedTab) ? requestedTab : "departments";

  function changeTab(tab) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-7">
      <PageHeader
        eyebrow="Governance"
        title="Organization setup"
        description="Maintain departments, asset categories, employee assignments, and role boundaries from one controlled workspace."
      />

      <Tabs value={activeTab} onValueChange={changeTab} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-11 min-w-max p-1 sm:w-full">
            <TabsTrigger value="departments" className="min-w-36 px-4">
              <Building2 aria-hidden="true" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="categories" className="min-w-36 px-4">
              <Shapes aria-hidden="true" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="employees" className="min-w-36 px-4">
              <UsersRound aria-hidden="true" />
              Employees
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="departments">
          <DepartmentsPanel />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesPanel />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeesPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}
