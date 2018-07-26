(function () {
	angular.module('app').controller('coldCtrl', ['$scope', '$window', 'customerService', 'securityService', '$uibModal', 'moment',
		'DTOptionsBuilder', 'DTColumnDefBuilder',
		function ($scope, $window, customerService, securityService, $modal, moment, DTOptionsBuilder, DTColumnDefBuilder) {

			$scope.DataStatus = 'Loading';
			$scope.dtOptions = DTOptionsBuilder.newOptions()
				.withOption('order', [0, 'asc']);
			appUtils.activeDatatableEuroDateFormat();
			$scope.dtColumnDefs = [
				DTColumnDefBuilder.newColumnDef(0).withOption('type', 'date-euro')
			];

			$scope.ShowClosedDetail = showClosedDetail;
			$scope.IsLastSaleToday = isLastSaleToday;
			$scope.GetReason = getReason;
			$scope.GetSubReason = getSubReason;
			$scope.OpenPdfPreview = openPdfPreview;
			$scope.ChangeCustomerAndGoToSla = changeCustomerAndGoToSla;
			$scope.ChangeCustomerAndGoToProfile = changeCustomerAndGoToProfile;
			$scope.CloseClosedCustomerDetailPopup = closeClosedCustomerDetailPopup;
			$scope.GeneratePdf = generatePdf;
			$scope.pdfDownloadBtnShow = true;;
			$scope.CloseCustomerPDFPopup = closeCustomerPDFPopup;
			var d = new Date();
			d.setMonth(d.getMonth() - 3);
			moment.duration(1, 'days');
			$scope.DateRange = { endDate: new Date(), startDate: d }
			setCurrentUserInfo();
			//----------------------  Implementation  ---------------------
			function setCurrentUserInfo() {

				$scope.DataStatus = 'Loading';
				var userFileds = [];
				securityService.GetCurrentUser(function (data) {

					angular.forEach(data.RelatedCustomers.Customers, function (key, value) {

						appUtils.convertDateStringsToDates(key);
						userFileds.push(key);
					});
					$scope.User = data;
					$scope.Model = data.RelatedCustomers;
					angular.forEach($scope.Model.Customers, appUtils.convertDateStringsToDates);
					getActivities();

				});
			}
			function getActivities() {

				customerService.GetAllActivities(function (data) {

					angular.forEach(data.CustomerActivityHistoryList, function (key, value) {

						appUtils.convertDateStringsToDates(key);
						appUtils.convertDateStringsToDates(key.Customer);

					});
					$scope.AllActivities = getActivityForRelatedCustomer(data.CustomerActivityHistoryList, $scope.Model.Customers);
					$scope.Model.NewActivities = getNewActivities($scope.AllActivities);

				});
			}

			function getActivityForRelatedCustomer(acivitiesList, customerList) {

				var result = [];

				acivitiesList.forEach(function (ac) {

					customerList.forEach(function (cus) {

						if (ac.CustomerId === cus.CustomerIdInCustomerTable) {

							ac.Customer = cus;
							result.push(ac);
						}

					});

				});
				return result;
			}

			function getNewActivities(activities) {

				var newArr = [];
				activities.forEach(function (element) {

					if (element.Status.Status === 'New')

						newArr.push(element);
				});
				$scope.DataStatus = 'Loaded';
				return newArr;
			}

			function isLastSaleToday(day) {

				if (day) {
					var now = new Date();
					if (now.getDate() === day.getDate() && now.getMonth() === day.getMonth() && now.getYear() === day.getYear())
						return 1;
					else
						return 0;
				}
				else
					return 2;
			}

			function getReason(reson) {

				if (reson.ParentDescription)
					return reson.ParentDescription;
				else
					return reson.Description;
			}

			function getSubReason(reson) {

				if (reson.ParentDescription)
					return reson.Description;
				else
					return '';
			}

			function showClosedDetail(ev, activity) {

				$scope.Activity = activity;
				$scope.Activity.Reason = getReason(activity.CustomerActivityReason);
				$scope.Activity.SubReason = getSubReason(activity.CustomerActivityReason);
				$window.open('/Customer/ClosingCustomer/' + $scope.Activity.Customer.Id + '/31','_blank');
				//$scope.closedCustomerDetailPopup = $modal.open({

				//	scope: $scope,
				//	templateUrl: 'HtmlTemplates/Customer/CloseedCustomerDetail.html',
				//	parent: angular.element(document.body),
				//	targetEvent: ev,
				//	clickOutsideToClose: true,
				//	fullscreen: false,
				//	windowClass: 'app-modal-windowwider'

				//});
			}
			function openPdfPreview(activity, ev) {

				$scope.Activity = activity;
				$scope.Activity.Reason = getReason(activity.CustomerActivityReason);
				$scope.Activity.SubReason = getSubReason(activity.CustomerActivityReason);

				$scope.closedCustomerPDFPopup = $modal.open({

					scope: $scope,
					templateUrl: 'HtmlTemplates/Customer/ClosingCustomerPDF.html',
					parent: angular.element(document.body),
					targetEvent: ev,
					clickOutsideToClose: true,
					fullscreen: false,
					windowClass: 'app-modal-window'

				});
			}

			function changeCustomerAndGoToSla(selectedCustomer) {

				$scope.DataStatus = 'Loaded';
				$scope.DesableClick = true;
				$window.location.href = "/Customer/CustomerSLA/" + selectedCustomer.Id;
			}

			function changeCustomerAndGoToProfile(selectedCustomer) {

				$scope.DataStatus = 'Loaded';
				$window.location.href = "/Customer/Edit/" + selectedCustomer.Id;
			}

			function closeClosedCustomerDetailPopup() {

				$scope.closedCustomerDetailPopup.close();
			}

			function generatePdf() {

				var delayMillis = 500;
				$scope.pdfDownloadBtnShow = false;
				setTimeout(function () {
					toPdf("pdfFormtest", "ClosingCustomerForm");
				}, delayMillis);
			}

			function toPdf(elementId, outputFileName) {

				html2canvas(document.getElementById(elementId), {
					onrendered: function (canvas) {
						var data = canvas.toDataURL();

						var docDefinition = {
							content: [{
								image: data,
								width: 1000,
							}],
							pageMargins: [0, 30, 10, 30],
							pageSize: 'A4',
							pageOrientation: 'landscape',
							header: {
								text: '',
								alignment: "center",
								fontSize: 35,
								margin: [0, 20],
							},

						};
						pdfMake.createPdf(docDefinition).download(outputFileName + ".pdf");
						setTimeout(function () {
							$scope.pdfDownloadBtnShow = true;
							$scope.closedCustomerPDFPopup.close();
						}, 1);

					}
				});

			}

			function closeCustomerPDFPopup() {

				$scope.closedCustomerPDFPopup.close();
			}
		}]);
})();