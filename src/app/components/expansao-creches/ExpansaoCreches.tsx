import { useState } from 'react';
import Dashboard from './Dashboard';
import Schools from './Schools';
import Kanban from './Kanban';
import PlanosList from './PlanosList';
import SchoolsList from './SchoolsList';
import PlanoForm from './PlanoForm';
import SchoolForm from './SchoolForm';
import SchoolView from './SchoolView';
import Reports from './Reports';
import ReportFilters from './ReportFilters';
import ReportView from './ReportView';
import Servidores from './Servidores';
import ConfiguracoesCusto from './ConfiguracoesCusto';
import UnidadesEscolares from './UnidadesEscolares';
import PlanoView from './PlanoView';
import QuadroKanbanGlobal from './QuadroKanbanGlobal';

type View = 'dashboard' | 'schools' | 'kanban' | 'planos' | 'all-schools' | 'new-plano' | 'edit-plano' | 'view-plano' | 'new-school' | 'edit-school' | 'view-school' | 'reports' | 'report-filters' | 'report-view' | 'servidores' | 'configuracoes-custo' | 'unidades-escolares';

interface NavigationState {
  view: View;
  planId?: string;
  schoolId?: string;
  reportType?: string;
  reportFilters?: any;
}

interface ExpansaoCrechesProps {
  initialView?: View;
}

export default function ExpansaoCreches({ initialView = 'dashboard' }: ExpansaoCrechesProps) {
  const [navigation, setNavigation] = useState<NavigationState>({
    view: initialView
  });

  const handleNavigate = (view: string, id?: string | any) => {
    if (view === 'schools') {
      setNavigation({ view: 'schools', planId: id });
    } else if (view === 'kanban') {
      setNavigation({ ...navigation, view: 'kanban', schoolId: id });
    } else if (view === 'planos') {
      setNavigation({ view: 'planos' });
    } else if (view === 'all-schools') {
      setNavigation({ view: 'all-schools' });
    } else if (view === 'new-plano') {
      setNavigation({ view: 'new-plano' });
    } else if (view === 'edit-plano') {
      setNavigation({ view: 'edit-plano', planId: id });
    } else if (view === 'new-school') {
      setNavigation({ view: 'new-school' });
    } else if (view === 'edit-school') {
      setNavigation({ view: 'edit-school', schoolId: id });
    } else if (view === 'view-school') {
      setNavigation({ view: 'view-school', schoolId: id });
    } else if (view === 'reports') {
      setNavigation({ view: 'reports' });
    } else if (view === 'report-filters') {
      setNavigation({ view: 'report-filters', reportType: id });
    } else if (view === 'report-view') {
      setNavigation({ view: 'report-view', reportType: id.reportType, reportFilters: id.filters });
    } else if (view === 'servidores') {
      setNavigation({ view: 'servidores' });
    } else if (view === 'configuracoes-custo') {
      setNavigation({ view: 'configuracoes-custo' });
    } else if (view === 'unidades-escolares') {
      setNavigation({ view: 'unidades-escolares' });
    } else if (view === 'view-plano') {
      setNavigation({ view: 'view-plano', planId: id });
    } else {
      setNavigation({ view: 'dashboard' });
    }
  };

  const handleBack = () => {
    if (navigation.view === 'kanban') {
      if (navigation.planId) {
        setNavigation({ view: 'schools', planId: navigation.planId });
      } else {
        setNavigation({ view: 'all-schools' });
      }
    } else if (navigation.view === 'schools') {
      setNavigation({ view: 'planos' });
    } else if (navigation.view === 'new-plano' || navigation.view === 'edit-plano' || navigation.view === 'view-plano') {
      setNavigation({ view: 'planos' });
    } else if (navigation.view === 'new-school' || navigation.view === 'edit-school' || navigation.view === 'view-school') {
      setNavigation({ view: 'all-schools' });
    } else if (navigation.view === 'report-filters') {
      setNavigation({ view: 'reports' });
    } else if (navigation.view === 'report-view') {
      setNavigation({ view: 'report-filters', reportType: navigation.reportType });
    } else {
      setNavigation({ view: 'dashboard' });
    }
  };

  return (
    <>
      {navigation.view === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}
      {navigation.view === 'planos' && (
        <PlanosList onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {navigation.view === 'new-plano' && (
        <PlanoForm onBack={handleBack} isEdit={false} />
      )}
      {navigation.view === 'edit-plano' && (
        <PlanoForm onBack={handleBack} isEdit={true} planId={navigation.planId} />
      )}
      {navigation.view === 'all-schools' && (
        <QuadroKanbanGlobal />
      )}
      {navigation.view === 'new-school' && (
        <SchoolForm onBack={handleBack} isEdit={false} />
      )}
      {navigation.view === 'edit-school' && (
        <SchoolForm onBack={handleBack} isEdit={true} />
      )}
      {navigation.view === 'view-school' && navigation.schoolId && (
        <SchoolView
          schoolId={navigation.schoolId}
          onNavigate={handleNavigate}
          onBack={handleBack}
        />
      )}
      {navigation.view === 'schools' && navigation.planId && (
        <Schools
          planId={navigation.planId}
          onNavigate={handleNavigate}
          onBack={handleBack}
        />
      )}
      {navigation.view === 'kanban' && navigation.schoolId && (
        <Kanban
          schoolId={navigation.schoolId}
          onBack={handleBack}
        />
      )}
      {navigation.view === 'reports' && (
        <Reports onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {navigation.view === 'report-filters' && navigation.reportType && (
        <ReportFilters
          reportType={navigation.reportType}
          onNavigate={handleNavigate}
          onBack={handleBack}
        />
      )}
      {navigation.view === 'report-view' && navigation.reportType && navigation.reportFilters && (
        <ReportView
          reportType={navigation.reportType}
          filters={navigation.reportFilters}
          onBack={handleBack}
        />
      )}
      {navigation.view === 'servidores' && (
        <Servidores onBack={handleBack} />
      )}
      {navigation.view === 'configuracoes-custo' && (
        <ConfiguracoesCusto onBack={handleBack} />
      )}
      {navigation.view === 'unidades-escolares' && (
        <UnidadesEscolares onBack={handleBack} />
      )}
      {navigation.view === 'view-plano' && (
        <PlanoView
          planId={navigation.planId}
          onBack={handleBack}
          onEdit={() => handleNavigate('edit-plano', navigation.planId)}
        />
      )}
    </>
  );
}
