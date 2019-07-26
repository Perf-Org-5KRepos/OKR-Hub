import * as React from "react";
import { StateContext } from "../StateMangement/StateProvider";
import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { TextField } from "azure-devops-ui/TextField";
import { KR, Objective } from "../Objective/Objective";
import produce from "immer";
import { Guid } from "guid-typescript";

export interface IOKRFormProps {
    objective?: Objective;
}

export interface IOKRFormState {
    name: string;
    owner: [];
    krs: KR[];
    comments: string[];
}

export default class OKRForm extends React.Component<IOKRFormProps, IOKRFormState> {
    static contextType = StateContext;
    constructor(props: IOKRFormProps) {
        super(props);
        this.state = {
            name: props.objective? props.objective.Name : "",
            owner: [], 
            krs: props.objective ? props.objective.KRs : [],
            comments: props.objective ? props.objective.Comments : []
        }
    }
    
    public render(): JSX.Element {
        const [{ areas, selectedArea, timeFrame }, actions] = this.context;
        const { name, krs } = this.state;
        return (
            <>
            <div className="okr-form-fields">
                <TextField
                    className="okr-form-objective-name"
                    value={name}
                    placeholder="Objective"
                    onChange={(e, newValue) => {
                        this.setState({name: newValue});
                    }}
                />
                <div className="okr-form-krs">
                        { krs && krs.map((kr, index) => (
                        <div className="kr-editor">
                            <TextField
                                key = {"content" + index}
                                value={kr.Content}
                                placeholder="Key Result"
                                multiline={true}
                                onChange={(e, newValue) => {
                                    this.setState(produce(this.state, draft => {
                                        var found = draft.krs.filter((x) => x.Id === kr.Id)[0];
                                        found.Content = newValue;
                                    }));
                                }}
                            />
                            <Button key = {"delete" + index} iconProps={{ iconName: "Delete" }} onClick={() => {
                                this.setState({krs: krs.filter((x) => x.Id !== kr.Id)});
                            }}/>
                            </div>))}
                </div>
                <Button className="okr-form-add-kr" text="Add KR" iconProps={{ iconName: "Add" }} onClick={() => {
                    this.setState({krs: [...krs, {
                        Id: Guid.create().toString(),
                        Content: "",
                        Status:  "Queued",
                        Comment: ""
                    }]});
                }}/>
                </div>
            <div className="okr-form-submit">
                <ButtonGroup>
                    <Button text="Cancel" onClick={() => {
                        actions.cancelCreationOrEdit({});
                    }}/>
                    {this.props.objective === undefined ? <Button text="Create" primary={true} onClick={() => {
                        actions.createOKR({
                            Owner: this.state.owner,
                            Name: this.state.name,
                            Comments: this.state.comments,
                            KRs: this.state.krs,
                            AreaId: selectedArea.AreaId || (areas && areas[0].AreaId) || "test",
                            TimeFrame: timeFrame,
                            Progress: 0
                        });
                    }}/> : <Button text="Save" primary={true} onClick={() => {
                        actions.editOKR(Object.assign(this.props.objective, {
                            Owner: this.state.owner,
                            Name: this.state.name,
                            Comments: this.state.comments,
                            KRs: this.state.krs
                        }));
                    }}/>}
                </ButtonGroup>
             </div>
            </>
        );
    }
}

