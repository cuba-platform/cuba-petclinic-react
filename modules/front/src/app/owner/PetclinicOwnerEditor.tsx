import * as React from "react";
import {FormEvent} from "react";
import {Button, Card, Col, Form, message, Modal, Row, Spin, Table, Tag} from "antd";
import {observer} from "mobx-react";
import {PetclinicOwnerManagement} from "./PetclinicOwnerManagement";
import {FormComponentProps} from "antd/lib/form";
import {Link, Redirect} from "react-router-dom";
import {action, IReactionDisposer, observable, reaction} from "mobx";
import {
  collection,
  ComparisonType,
  FormField,
  generateDataColumn,
  getCubaREST,
  handleTableChange,
  injectMainStore,
  instance,
  MainStoreInjected,
  Msg
} from "@cuba-platform/react";
import {Owner} from "../../cuba/entities/petclinic_Owner";
import {Pet} from "../../cuba/entities/petclinic_Pet";
import {SerializedEntity} from "@cuba-platform/rest";
import {PaginationConfig} from "antd/es/pagination";
import {SorterResult} from "antd/es/table";
import {PetType} from "../../cuba/entities/petclinic_PetType";

type Props = FormComponentProps & MainStoreInjected & {
  entityId: string;
};

@injectMainStore
@observer
class PetclinicOwnerEditor extends React.Component<Props> {

  dataInstance = instance<Owner>(Owner.NAME, {view: 'owner-with-pets', loadImmediately: false});
  petsCollection = collection<Pet>(Pet.NAME, {
    view: 'pet-with-owner-and-type',
    sort: 'identificationNumber',
    filter: {conditions: [{property: 'owner', operator: "=", value: this.props.entityId}]}
  });

  @observable
  updated = false;

  reactionDisposer: IReactionDisposer;

  fields = ['address', 'city', 'email', 'telephone', 'firstName', 'lastName', 'pets',];
  petFields = ['name', 'identificationNumber', 'generation', 'birthDate', 'type'];

  @observable.ref filters: Record<string, string[]> | undefined;
  @observable operator: ComparisonType | undefined;
  @observable petValue: any;

  @action
  handlePetTableOperatorChange = (operator: ComparisonType) => this.operator = operator;

  @action
  handlePetTableValueChange = (value: any) => this.petValue = value;

  @action
  handlePetTableChange = (pagination: PaginationConfig, tableFilters: Record<string, string[]>, sorter: SorterResult<Pet>): void => {
    this.filters = tableFilters;

    handleTableChange({
      pagination: pagination,
      filters: tableFilters,
      sorter: sorter,
      defaultSort: '-identificationNumber',
      fields: this.petFields,
      mainStore: this.props.mainStore!,
      dataCollection: this.petsCollection
    });
  };

  showReleaseDialog = (pet: SerializedEntity<Pet>) => {
    Modal.confirm({
      title: `Are you sure you want to release ${pet._instanceName}?`,
      okText: 'Release',
      cancelText: 'Cancel',
      onOk: () => {
        pet.owner = null;
        return getCubaREST()!
          .commitEntity(Pet.NAME, pet)
          .then(() => {
            this.petsCollection.load();
          });
      }
    });
  };

  handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (err) {
        message.warn('Validation Error. Please check the data you entered.');
        return;
      }
      this.dataInstance.update(this.props.form.getFieldsValue(this.fields))
        .then(() => {
          message.success('Entity has been updated');
          this.updated = true;
        })
        .catch(() => {
          alert('Error')
        });
    });
  };

  render() {

    if (this.updated) {
      return <Redirect to={PetclinicOwnerManagement.PATH}/>
    }

    const {getFieldDecorator} = this.props.form;
    const {status} = this.dataInstance;

    return (
      <Card title="Owner" style={{maxWidth: "1024px"}} className='editor-layout-narrow'>
        <Form onSubmit={this.handleSubmit}
              layout='vertical'>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label={<Msg entityName={Owner.NAME} propertyName='firstName'/>}
                         key='firstName'
                         style={{marginBottom: '12px'}}>{
                getFieldDecorator('firstName', {rules: [{required: true}]})(
                  <FormField entityName={Owner.NAME}
                             propertyName='firstName'/>
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Msg entityName={Owner.NAME} propertyName='lastName'/>}
                         key='lastName'
                         style={{marginBottom: '12px'}}>{
                getFieldDecorator('lastName')(
                  <FormField entityName={Owner.NAME}
                             propertyName='lastName'/>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label={<Msg entityName={Owner.NAME} propertyName='city'/>}
                         key='city'
                         style={{marginBottom: '12px'}}>{
                getFieldDecorator('city', {rules: [{required: true}]})(
                  <FormField entityName={Owner.NAME}
                             propertyName='city'/>
                )}
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item label={<Msg entityName={Owner.NAME} propertyName='address'/>}
                         key='address'
                         style={{marginBottom: '12px'}}>{
                getFieldDecorator('address', {rules: [{required: true}]})(
                  <FormField entityName={Owner.NAME}
                             propertyName='address'/>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label={<Msg entityName={Owner.NAME} propertyName='email'/>}
                         key='email'
                         style={{marginBottom: '12px'}}>{
                getFieldDecorator('email')(
                  <FormField entityName={Owner.NAME}
                             propertyName='email'/>
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Msg entityName={Owner.NAME} propertyName='telephone'/>}
                         key='telephone'
                         style={{marginBottom: '12px'}}>{
                getFieldDecorator('telephone')(
                  <FormField entityName={Owner.NAME}
                             propertyName='telephone'/>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<Msg entityName={Owner.NAME} propertyName='pets'/>}
                     key='pets'
                     style={{marginBottom: '12px'}}>{
            petsTable({
              items: this.petsCollection.items,
              fields: this.petFields,
              entityName: this.petsCollection.entityName,
              filters: this.filters,
              operator: this.operator,
              onOperatorChange: this.handlePetTableOperatorChange,
              value: this.petValue,
              onValueChange: this.handlePetTableValueChange,
              enableSorter: true,
              enableFilter: true,
              mainStore: this.props.mainStore!,
              onChange: this.handlePetTableChange,
              showSizeChanger: true,
              itemsCount: this.petsCollection.count,
              showReleaseDialog: this.showReleaseDialog
            })
          }
          </Form.Item>

          <Form.Item style={{textAlign: 'center'}}>
            <Link to={PetclinicOwnerManagement.PATH}>
              <Button htmlType="button">
                Cancel
              </Button>
            </Link>
            <Button type="primary"
                    htmlType="submit"
                    disabled={status !== "DONE" && status !== "ERROR"}
                    loading={status === "LOADING"}
                    style={{marginLeft: '8px'}}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  }

  componentDidMount() {
    if (this.props.entityId !== PetclinicOwnerManagement.NEW_SUBPATH) {
      this.dataInstance.load(this.props.entityId);
    } else {
      this.dataInstance.setItem(new Owner());
    }
    this.reactionDisposer = reaction(
      () => {
        return this.dataInstance.item
      },
      () => {
        this.props.form.setFieldsValue(this.dataInstance.getFieldValues(this.fields));
      }
    )
  }

  componentWillUnmount() {
    this.reactionDisposer();
  }

}

function petsTable(props: any) {
  let isMainStoreAvailable = !!props.mainStore
    && !!props.mainStore.messages
    && !!props.mainStore.metadata
    && !!props.mainStore.enums;

  if (!isMainStoreAvailable) {
    return (
      <div className='cuba-data-table-loader'>
        <Spin size='large'/>
      </div>
    );
  } else {
    return (
      <Table dataSource={props.items.slice()}
             onChange={props.handleChange}
             pagination={{
               showSizeChanger: props.showSizeChanger,
               total: props.itemsCount,
             }}
             columns={[
               generateDataColumn({
                 propertyName: 'name',
                 entityName: props.entityName,
                 filters: props.filters,
                 operator: props.operator,
                 onOperatorChange: props.handleOperatorChange,
                 value: props.value,
                 onValueChange: props.handleValueChange,
                 enableSorter: props.enableSorter,
                 enableFilter: props.enableFilter,
                 mainStore: props.mainStore
               }),
               generateDataColumn({
                 propertyName: 'identificationNumber',
                 entityName: props.entityName,
                 filters: props.filters,
                 operator: props.operator,
                 onOperatorChange: props.handleOperatorChange,
                 value: props.value,
                 onValueChange: props.handleValueChange,
                 enableSorter: props.enableSorter,
                 enableFilter: props.enableFilter,
                 mainStore: props.mainStore
               }),
               generateDataColumn({
                 propertyName: 'generation',
                 entityName: props.entityName,
                 filters: props.filters,
                 operator: props.operator,
                 onOperatorChange: props.handleOperatorChange,
                 value: props.value,
                 onValueChange: props.handleValueChange,
                 enableSorter: props.enableSorter,
                 enableFilter: props.enableFilter,
                 mainStore: props.mainStore
               }),
               generateDataColumn({
                 propertyName: 'birthDate',
                 entityName: props.entityName,
                 filters: props.filters,
                 operator: props.operator,
                 onOperatorChange: props.handleOperatorChange,
                 value: props.value,
                 onValueChange: props.handleValueChange,
                 enableSorter: props.enableSorter,
                 enableFilter: props.enableFilter,
                 mainStore: props.mainStore
               }),
               {
                 title: <Msg entityName={Pet.NAME} propertyName='type'/>,
                 dataIndex: "type",
                 key: "type",
                 render: (type: SerializedEntity<PetType>) => (
                   <Tag color={type.color ? '#' + type.color : undefined}>{type._instanceName}</Tag>
                 )
               },
               {
                 title: "Action",
                 key: "action",
                 render: (pet) => (
                   <Button type="link"
                           style={{padding: 0}}
                           onClick={() => props.showReleaseDialog(pet)}>
                     Release
                   </Button>
                 )
               }
             ]}
      />
    );
  }
}

export default Form.create<Props>()(PetclinicOwnerEditor);
