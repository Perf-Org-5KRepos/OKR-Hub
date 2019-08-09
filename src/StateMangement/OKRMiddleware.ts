import * as Actions from "./OKRActionTypes";
import { ObjectiveService } from '../Objective/ObjectiveService';
import { Objective } from '../Objective/Objective';
import { AreaService } from '../Area/AreaService';
import { TimeFrameService } from '../TimeFrame/TimeFrameService';
import { Area } from '../Area/Area';
import { OKRDocument } from '../Data/OKRDocument';
import { OKRDataService } from '../Data/OKRDataService';
import { TimeFrame } from '../TimeFrame/TimeFrame';
import { OKRMainState } from "./OKRState";
import { Guid } from "guid-typescript";

export const applyMiddleware = (dispatch, state) => action =>
    dispatch(action) || runMiddleware(dispatch, action, state);

const runMiddleware = (dispatch, action, state: OKRMainState) => {
    switch (action.type) {
        case Actions.initialize:
            try {
                const timeFrames = TimeFrameService.instance.getAll();
                const areas = AreaService.instance.getAll();

                Promise.all([timeFrames, areas]).then((value) => {
                    // Dispatch successful initialization
                    dispatch({
                        type: Actions.initializeSucceed,
                        payload: value
                    });
                },
                    (error) => {
                        // This error means we haven't initalized anything yet
                        if (error && error.serverError && error.serverError.typeKey === "DocumentCollectionDoesNotExistException") {
                            const emptyPayload = [[], []];
                            dispatch({
                                type: Actions.initializeWithZeroData,
                                payload: emptyPayload
                            })
                        }
                        else {
                            // Dispatch error
                            dispatch({
                                type: Actions.areaOperationFailed,
                                payload: error
                            })
                        }
                    })
            }
            catch (error) {
                if (error && error.serverError && error.serverError.typeKey === "DocumentCollectionDoesNotExistException") {
                    const emptyPayload = [{}, []];
                    dispatch({
                        type: Actions.initializeSucceed,
                        payload: emptyPayload
                    })
                }
            }

            break;

        case Actions.getObjectives:
            ObjectiveService.instance.getAll(state.displayedTimeFrame.id).then((allObjectives: Objective[]) => {
                dispatch({
                    type: Actions.getObjectivesSucceed,
                    payload: allObjectives
                })
            }, (error) => {
                dispatch({
                    type: Actions.getObjectivesFailed,
                    error: error
                });
            });
            break;
        
        case Actions.getTimeFrames:
            TimeFrameService.instance.getAll().then((allTimeFrames: TimeFrame[]) => {
                dispatch({
                    type: Actions.initializeSucceed,
                    payload: allTimeFrames
                });
            }, (error) => {
                dispatch({
                    type: "TODO",
                    error: error
                });
            });
            break;
        case Actions.addTimeFrame:
            TimeFrameService.instance.create(action.payload).then((created) => {
                dispatch({
                    type: Actions.addTimeFrameSucceed,
                    payload: created
                });
            }, (error) => {
                dispatch({
                    type: "TODO",
                    error: error
                });
            });
            break;
        case Actions.editTimeFrame:
            TimeFrameService.instance.save(action.payload).then((updated) => {
                dispatch({
                    type: Actions.editTimeFrameSucceed,
                    payload: updated
                });
            }, (error) => {
                dispatch({
                    type: "Todo",
                    error: error
                });
            });
            break;

        case Actions.getProjectName:
            OKRDataService.getProjectName().then((projectName: string) => {
                dispatch({
                    type: Actions.getProjectNameSucceed,
                    projectName: projectName
                });
            }, (error) => {
                dispatch({
                    type: Actions.getProjectNameFailed,
                    error: error
                });
            });
            break;
        case Actions.editOKR:
            ObjectiveService.instance.save(action.payload, state.displayedTimeFrame.id).then((updated) => {
                dispatch({
                    type: Actions.editOKRSucceed,
                    payload: updated
                });
            }, (error) => {
                dispatch({
                    type: Actions.objectiveOperationFailed,
                    error: error
                });
            });
            break;
        case Actions.editKRStatus:
            ObjectiveService.instance.save(action.payload, state.displayedTimeFrame.id).then((updated) => {
                dispatch({
                    type: Actions.editOKRSucceed,
                    payload: updated
                });
            }, (error) => {
                dispatch({
                    type: Actions.objectiveOperationFailed,
                    error: error
                });
            });
            break;
        case Actions.createOKR:
            const objectiveOrders = action.payload.objectives.map((value: Objective) => value.order);
            action.payload.data.order = Math.max(...objectiveOrders, 0) + 10;
            ObjectiveService.instance.create(action.payload.data, state.displayedTimeFrame.id).then((created) => {
                dispatch({
                    type: Actions.createOKRSucceed,
                    payload: created
                });
            }, (error) => {
                dispatch({
                    type: Actions.objectiveOperationFailed,
                    error: error
                });
            });
            break;
        case Actions.createArea:
            // If we don't have any time frames, create one so the objective page works  
            if (state.areas.length === 0 && state.displayedTimeFrame === undefined) {
                const newTimeFrame: TimeFrame = {
                    name: "Current",
                    isCurrent: true,
                    id: Guid.create().toString(),
                    order: 0
                };
                dispatch({
                    type: Actions.addTimeFrame,
                    payload: newTimeFrame
                });
            }

            AreaService.instance.create(action.payload.data).then((created) => {
                dispatch({
                    type: Actions.createAreaSucceed,
                    payload: created
                });
            }, (error) => {
                dispatch({
                    type: Actions.createAreaFailed,
                    error: error
                });
            });

            break;
        case Actions.editArea:
            AreaService.instance.save(action.payload).then((updated) => {
                dispatch({
                    type: Actions.editAreaSucceed,
                    payload: updated
                });
            }, (error) => {
                dispatch({
                    type: Actions.areaOperationFailed,
                    error: error
                });
            });
            break;
        case Actions.removeOKR:
            ObjectiveService.instance.delete((docuemnt: OKRDocument) => {
                return docuemnt.id === action.payload.id;
            }, state.displayedTimeFrame.id).then(() => {
                dispatch({
                    type: Actions.removeOKRSucceed,
                    id: action.payload.id
                });
            }, (error) => {
                dispatch({
                    type: Actions.objectiveOperationFailed,
                    error: error
                });
            });
            break;
        case Actions.removeArea:
            AreaService.instance.delete((area: Area) => {
                return area.id === action.payload.id;
            }).then(() => {
                dispatch({
                    type: Actions.removeAreaSucceed,
                    id: action.payload.id
                });
                ObjectiveService.instance.delete((okr: Objective) => {
                    return okr.AreaId === action.payload.areaId;
                });
            }, (error) => {
                dispatch({
                    type: Actions.areaOperationFailed,
                    error: error
                });
            });
            break;
    }
}