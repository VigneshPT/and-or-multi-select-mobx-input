import { Icon } from "antd";
import { action, IObservable, isObservableArray } from "mobx";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { components } from "react-select";
import CreatableSelect from "react-select/creatable";
import { get } from "lodash";

const selectRef: any = React.createRef();

const createOption = (label: string, index: number) => ({
  label,
  value: `${index}_${label}`,
  index,
  operand: "or"
});

const transformValues = (valuesArray: IOperandMultiSelectValue[]) => {
  const operandStack: IOperandMultiSelectValue[] = [];
  const transformedValue: string[][] = [];
  if (valuesArray && valuesArray.length > 0) {
    for (const item of valuesArray) {
      if (!item.operand || item.operand === "or") {
        // pop all in operand stack as an array into transformedValue.
        // then push the current iter value to the operandStack.
        const pushToFinalValues: IOperandMultiSelectValue[] = operandStack.splice(
          0,
          operandStack.length
        );
        if (pushToFinalValues.length > 0) {
          transformedValue.push(pushToFinalValues.map(v => v.label));
        }
        operandStack.push(item);
      } else if (item.operand === "and") {
        // push to operandStack.
        operandStack.push(item);
      }
    }
    if (operandStack.length > 0) {
      const pushToFinalValues = operandStack.splice(0, operandStack.length);
      transformedValue.push(pushToFinalValues.map(v => v.label));
    }
  }
  return transformedValue;
};

const MultiValueRemove = props => {
  const closeIconStyle = {
    fontSize: "12px",
    transform: "scale(0.8333)"
  };
  return (
    <components.MultiValueRemove {...props}>
      <Icon style={closeIconStyle} type="close" />
    </components.MultiValueRemove>
  );
};

interface IProps {
  handleChange?: (values: any) => void;
  className?: string;
  classNamePrefix?: string;
  placeholder?: string;
  values: IObservable | string[][];
  theme?: any;
}

export interface IOperandMultiSelectValue {
  value: string;
  operand: string;
  label: string;
}

@observer
export default class AndOrMultiSelectInput extends Component<IProps> {
  static defaultProps = {
    placeholder: "Type something and press enter..."
  };

  state = {
    inputValue: ""
  };

  internalValues = () => {
    return this.transformToInternalValues(this.props.values);
  };

  transformToInternalValues = values => {
    const transformedValues: any[] = [];
    if (values && values.length > 0) {
      for (const andGroup of values) {
        andGroup.forEach((item, index) => {
          const transformedValue: any = {
            label: item,
            index: transformedValues.length,
            value: `${transformedValues.length}_${item}`
          };
          if (index === 0) {
            transformedValue.operand = "or";
          } else {
            transformedValue.operand = "and";
          }
          transformedValues.push(transformedValue);
        });
      }
    }
    return transformedValues;
  };

  @action
  handleChange = (value: any, actionMeta: any) => {
    if (value && value.length > 0) {
      value = value.map((v, i) => {
        v.index = i;
        v.value = `${i}_${v.value}`;
        return v;
      });
    }

    console.log("onChange");
    const newValues = transformValues(value);
    if (isObservableArray(this.props.values)) {
      this.props.values.replace(newValues);
    }
    if (this.props.handleChange) {
      this.props.handleChange(newValues);
    }
  };
  handleInputChange = (inputValue: string) => {
    this.setState({ inputValue });
  };

  @action
  handleKeyDown = event => {
    const { inputValue } = this.state;
    if (!inputValue) {
      return;
    }
    switch (event.key) {
      case "Enter":
      case "Tab":
        const internalValues = this.transformToInternalValues(
          this.props.values
        );
        console.log(internalValues);
        const index = internalValues.length;
        internalValues.push(createOption(inputValue, index));
        this.setState({
          inputValue: ""
        });
        const newValues = transformValues(internalValues);
        if (isObservableArray(this.props.values)) {
          this.props.values.replace(newValues);
        }
        console.log("this.props.values", this.props.values);
        console.log("this.props.handleChange", this.props.handleChange);
        if (this.props.handleChange) {
          console.log("handle change calling with value", newValues);
          this.props.handleChange(newValues);
        }
        event.preventDefault();
    }
  };

  MultiValueContainer = props => {
    const primaryColor = get(
      this.props,
      "theme.operandSecondaryColor",
      "#0087FE"
    );
    const secondaryColor = get(
      this.props,
      "theme.operandPrimaryColor",
      "#DAECFF"
    );
    // console.log("primaryColor", secondaryColor);
    const tagContainerStyles = {
      container: {
        display: "flex",
        alignItems: "center"
      },
      operandContainer: {
        backgroundColor: secondaryColor,
        borderRadius: "10px",
        fontSize: "85%",
        display: "flex",
        alignItems: "center",
        padding: "0px 5px",
        margin: "2px",
        border: `1px solid ${primaryColor}`,
        color: primaryColor,
        cursor: "pointer"
      }
    };

    return (
      <div style={tagContainerStyles.container} className="custom-container">
        {props.data.index !== 0 && (
          <button
            style={tagContainerStyles.operandContainer}
            onClick={e => this.operandToggleClick(e, props)}
          >
            <div>{props.data.operand}</div>
            <Icon
              style={{
                fontSize: "20px",
                marginRight: "-3px",
                marginLeft: "2px"
              }}
              type="ellipsis"
            />
          </button>
        )}
        <components.MultiValueContainer {...props} />
      </div>
    );
  };

  @action
  operandToggleClick = (event, props) => {
    // event.stopPropagation();
    // event.preventDefault();

    const internalValues = this.transformToInternalValues(this.props.values);
    const option: any = internalValues.find(
      (o: any) => o.index === props.data.index
    );
    if (option) {
      if (option.operand === "or") {
        option.operand = "and";
      } else {
        option.operand = "or";
      }
    }

    const newValues = transformValues(internalValues);
    if (isObservableArray(this.props.values)) {
      this.props.values.replace(newValues);
    }
    if (this.props.handleChange) {
      this.props.handleChange(newValues);
    }

    selectRef.current.select.blur();
  };

  render() {
    const { inputValue } = this.state;
    const { className, classNamePrefix, placeholder } = this.props;
    return (
      <CreatableSelect
        components={{
          MultiValueContainer: this.MultiValueContainer,
          MultiValueRemove,
          DropdownIndicator: null,
          ClearIndicator: null
        }}
        inputValue={inputValue}
        isClearable={true}
        isMulti={true}
        menuIsOpen={false}
        onChange={this.handleChange}
        onInputChange={this.handleInputChange}
        onKeyDown={this.handleKeyDown}
        placeholder={placeholder}
        value={this.internalValues()}
        ref={selectRef}
        className={className}
        classNamePrefix={classNamePrefix}
      />
    );
  }
}
