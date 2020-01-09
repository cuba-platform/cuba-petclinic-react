import * as React from "react";
import {FormEvent} from "react";
import {Button, Card, Col, Form, message, Modal, Row, Tag} from "antd";
import {observer} from "mobx-react";
import {PetclinicOwnerManagement} from "./PetclinicOwnerManagement";
import {FormComponentProps} from "antd/lib/form";
import {Link, Redirect} from "react-router-dom";
import {IReactionDisposer, observable, reaction} from "mobx";
import {
  collection, ColumnDefinition,
  ComparisonType, DataTable,
  FormField,
  getCubaREST,
  injectMainStore,
  instance,
  MainStoreInjected,
  Msg
} from "@cuba-platform/react";
import {Owner} from "../../cuba/entities/petclinic_Owner";
import {Pet} from "../../cuba/entities/petclinic_Pet";

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

  @observable.ref filters: Record<string, string[]> | undefined;
  @observable operator: ComparisonType | undefined;
  @observable petValue: any;

  showReleaseDialog = (pet: Pet) => {
    Modal.confirm({
      title: `Are you sure you want to release ${pet.name}?`,
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
            <DataTable
              dataCollection={this.petsCollection}
              columnDefinitions={this.columnDefinitions()}
              tableProps={{
                rowSelection: undefined
              }}
            />
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

  columnDefinitions(): Array<string | ColumnDefinition<Pet>> {
    const columnDefs: Array<string | ColumnDefinition<Pet>> = ['name', 'identificationNumber', 'generation', 'birthDate'];

    const petTypesColumn: ColumnDefinition<Pet> = {
      field: 'type',
      columnProps: {
        render: (text, record) => {
          const type = record.type;
          if (type != null) {
            return (
              <Tag color={type.color ? '#' + type.color : undefined}>{text}</Tag>
            );
          } else {
            return null;
          }
        }
      }
    };
    columnDefs.push(petTypesColumn);

    const releasePetColumn: ColumnDefinition<Pet> = {
      columnProps: {
        title: "Action",
        key: "action",
        render: (_text, pet) => (
          <Button type="link"
                  style={{padding: 0}}
                  onClick={() => this.showReleaseDialog(pet)}>
            Release
          </Button>
        )
      }
    };
    columnDefs.push(releasePetColumn);

    return columnDefs;
  }

}

export default Form.create<Props>()(PetclinicOwnerEditor);
