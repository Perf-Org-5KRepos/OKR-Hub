import { IObservableValue, ObservableValue } from "azure-devops-ui/Core/Observable";
import { List, ListItem, ListSelection, IListItemDetails, IListRow } from "azure-devops-ui/List";
import { DetailsPanel, MasterPanel, MasterPanelHeader } from "azure-devops-ui/MasterDetails";
import {
    BaseMasterDetailsContext,
    IMasterDetailsContext,
    IMasterDetailsContextLayer,
    MasterDetailsContext,
    bindSelectionToObservable
} from "azure-devops-ui/MasterDetailsContext";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from 'react';
import "./DetailViewMenu.scss";
import { DetailView } from "./DetailView";
import { useStateValue } from '../StateManagement/StateProvider';
import { Area } from "../Area/Area";
import { NavigationConstants } from "../OKRConstants";
import { Objective } from "../Objective/Objective";
import { AreaCardProgress } from "../AreaView/AreaCard/AreaCardProgress";
import { getObjectivesForArea } from "../StateManagement/OKRSelector";

interface AreaWithObjectives {
    area: Area; 
    objectives : Objective[]; 
}

const renderInitialRow = (
    index: number,
    item: AreaWithObjectives,
    details: IListItemDetails<AreaWithObjectives>,
): JSX.Element => {
    const currentObjectives = item.objectives;

    return (
        <ListItem
            key={"list-item" + index}
            index={index}
            details={details}
        >
            <div className="master-row-content">
                <div className="area-description">
                    <div className="area-name title">{item.area.Name}</div>
                    <div className="area-objectives-count">{currentObjectives.length.toString() + " objectives"}</div>
                </div>
                <AreaCardProgress objectives={currentObjectives} size="50" lineWidth="40" />
            </div>
        </ListItem>
    );
};

function createDetailsViewPayload(): IMasterDetailsContextLayer<AreaWithObjectives, undefined> {    

    const stateContext = useStateValue();
    const {areas, selectedArea, projectName } = stateContext.state; 

    // We need to pass the objectives with the areas to the renderInitialRow method. This is how we display objective counts
    const areasWithObjectives: AreaWithObjectives[] = areas.map((a: Area) => {
        const currentObjectives = getObjectivesForArea(stateContext.state, a); 
        return {
            area: a,
            objectives: currentObjectives
        }
    }); 

    const initialItemProvider = new ArrayItemProvider(areasWithObjectives);
    const selectedAreaWithObjectives = areasWithObjectives.find((a => a.area.id === selectedArea.id)); 
    
    return {
        key: "detail-view",
        masterPanelContent: {
            renderContent: (parentItem, initialSelectedMasterItem) => (
                <MasterPanelContent initialSelectedMasterItem={initialSelectedMasterItem} itemProvider={initialItemProvider} />
            ),
            renderHeader: () => <MasterPanelHeader title={projectName} />,
            onBackButtonClick: () => {
                stateContext.actions.navigatePage({
                    pageLocation: NavigationConstants.AreaView
                });
                return false;
            }
        },
        detailsContent: {
            // Pass the detail view just the area, no need to pass the special w/objectives data
            renderContent: item => <DetailView selectedArea={selectedArea} />
        },
        selectedMasterItem: new ObservableValue<AreaWithObjectives>(selectedAreaWithObjectives),
    };
}

const MasterPanelContent: React.FunctionComponent<{
    initialSelectedMasterItem: IObservableValue<AreaWithObjectives>, 
    itemProvider: ArrayItemProvider<AreaWithObjectives>
}> = props => {
    
    const stateContext = useStateValue();
    const initialSelection = new ListSelection({ selectOnFocus: false });
  
    React.useEffect(() => {
        // This is how the observable interacts with our selected item     
        bindSelectionToObservable(
            initialSelection,
            props.itemProvider,
            props.initialSelectedMasterItem
        );
    });
    
    const onListClick = (event: React.SyntheticEvent, listRow: IListRow<AreaWithObjectives>) => {
        stateContext.actions.updateSelectedArea({
            selectedArea: listRow.data.area
        });
    };

    return (
        <List
            itemProvider={props.itemProvider}
            selection={initialSelection}
            renderRow={renderInitialRow}
            onSelect={onListClick}
        />
    );
};


export const DetailViewMenu: React.FunctionComponent<{}> = props => {
    const detailViewMenuPayload = createDetailsViewPayload();

    const masterDetailsContext: IMasterDetailsContext = new BaseMasterDetailsContext(
        detailViewMenuPayload,
        () => { }
    );

    return (
        <MasterDetailsContext.Provider value={masterDetailsContext}>
            <div className="flex-row">
                <MasterPanel />
                <DetailsPanel />
            </div>
        </MasterDetailsContext.Provider>
    );
};
