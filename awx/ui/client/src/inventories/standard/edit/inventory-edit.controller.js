/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

/**
 * @ngdoc function
 * @name controllers.function:Inventories
 * @description This controller's for the Inventory page
 */

function InventoriesEdit($scope, $location,
    $stateParams, InventoryForm, Rest, ProcessErrors,
    ClearScope, GetBasePath, ParseTypeChange, Wait, ToJSON,
    ParseVariableString, $state, OrgAdminLookup, $rootScope, resourceData, CreateSelect2, InstanceGroupsService, InstanceGroupsData) {

    // Inject dynamic view
    let defaultUrl = GetBasePath('inventory'),
        form = InventoryForm,
        fld, data,
        inventoryData = resourceData.data,
        instance_group_url = inventoryData.related.instance_groups;

    init();

    function init() {
        form.formLabelSize = null;
        form.formFieldSize = null;

        $scope = angular.extend($scope, inventoryData);

        $scope.credential_name = (inventoryData.summary_fields.insights_credential && inventoryData.summary_fields.insights_credential.name) ? inventoryData.summary_fields.insights_credential.name : null;
        $scope.organization_name = inventoryData.summary_fields.organization.name;
        $scope.inventory_variables = inventoryData.variables === null || inventoryData.variables === '' ? '---' : ParseVariableString(inventoryData.variables);
        $scope.parseType = 'yaml';

        $scope.instanceGroupOptions = InstanceGroupsData;
        CreateSelect2({
            element: '#inventory_instance_groups',
            multiple: true,
            addNew: false
        });

        Rest.setUrl(instance_group_url);
        Rest.get()
            .then(({data}) => {
                if (data.results.length > 0) {
                    var opts = data.results
                        .map(i => ({id: i.id + "",
                                name: i.name}));
                    CreateSelect2({
                        element:'#inventory_instance_groups',
                        multiple: true,
                        addNew: false,
                        opts: opts
                    });
                }
            })
            .catch(({data, status}) => {
                ProcessErrors($scope, data, status, form, {
                    hdr: 'Error!',
                    msg: 'Failed to get instance groups. GET returned ' +
                        'status: ' + status
                });
            });

        $rootScope.$on('$stateChangeSuccess', function(event, toState) {
            if(toState.name === 'inventories.edit') {
                ParseTypeChange({
                    scope: $scope,
                    variable: 'inventory_variables',
                    parse_variable: 'parseType',
                    field_id: 'inventory_inventory_variables'
                });
            }
        });

        OrgAdminLookup.checkForAdminAccess({organization: inventoryData.organization})
        .then(function(canEditOrg){
            $scope.canEditOrg = canEditOrg;
        });

        $scope.inventory_obj = inventoryData;
        $rootScope.breadcrumb.inventory_name = inventoryData.name;

        $scope.$watch('inventory_obj.summary_fields.user_capabilities.edit', function(val) {
            if (val === false) {
                $scope.canAdd = false;
            }
        });
    }

    // Save
    $scope.formSave = function() {
        Wait('start');

        data = {};
        for (fld in form.fields) {
            if (form.fields[fld].realName) {
                data[form.fields[fld].realName] = $scope[fld];
            } else {
                data[fld] = $scope[fld];
            }
        }

        Rest.setUrl(defaultUrl + $stateParams.inventory_id + '/');
        Rest.put(data)
            .then(() => {
                InstanceGroupsService.editInstanceGroups(instance_group_url, $scope.instance_groups)
                    .then(() => {
                        Wait('stop');
                        $state.go($state.current, {}, { reload: true });
                    })
                    .catch(({data, status}) => {
                        ProcessErrors($scope, data, status, form, {
                            hdr: 'Error!',
                            msg: 'Failed to update instance groups. POST returned status: ' + status
                        });
                    });
            })
            .catch(({data, status}) => {
                ProcessErrors($scope, data, status, form, {
                    hdr: 'Error!',
                    msg: 'Failed to update inventory. PUT returned status: ' + status
                });
            });
    };

    $scope.formCancel = function() {
        $state.go('inventories');
    };

    $scope.remediateInventory = function(inv_id, inv_name, insights_credential){
        $state.go('templates.addJobTemplate', {inventory_id: inv_id, inventory_name:inv_name, credential_id: insights_credential});
    };

}

export default ['$scope', '$location',
    '$stateParams', 'InventoryForm', 'Rest',
    'ProcessErrors', 'ClearScope', 'GetBasePath', 'ParseTypeChange', 'Wait',
    'ToJSON', 'ParseVariableString',
    '$state', 'OrgAdminLookup', '$rootScope', 'resourceData', 'CreateSelect2', 'InstanceGroupsService', 'InstanceGroupsData', InventoriesEdit,
];