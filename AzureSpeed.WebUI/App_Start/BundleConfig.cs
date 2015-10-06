using System.Web.Optimization;

namespace AzureSpeed.WebUI
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/Content/css").Include(
                            "~/Content/bootstrap.css",
                            "~/Content/ui-bootstrap-csp.css",
                            "~/Content/font-awesome.css",
                            "~/Content/sb-admin-2.css",
                            "~/Content/site.css",
                            "~/Content/azurespeed.css"));

            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                            "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/3rd").Include(
                            "~/Scripts/async.js",
                            "~/Scripts/bootstrap.js",
                            "~/Scripts/angular.js",
                            "~/Scripts/angular-route.js",
                            "~/Scripts/angular-ui/ui-bootstrap.js",
                            "~/Scripts/angular-ui/ui-bootstrap-tpls.js",
                            "~/Scripts/highcharts-ng/highstock.js",
                            "~/Scripts/highcharts-ng/highcharts-ng.js",
                            "~/Scripts/d3/d3.js"));

            bundles.Add(new ScriptBundle("~/bundles/jazure").Include(
                            "~/Scripts/jazure/crypto-min.js",
                            "~/Scripts/jazure/jazure.core/jazure.core.js",
                            "~/Scripts/jazure/jazure.storage/jazure.storage.core.js",
                            "~/Scripts/jazure/jazure.storage/jazure.storage.account.js",
                            "~/Scripts/jazure/jazure.storage/blob/jazure.storage.container.js",
                            "~/Scripts/jazure/jazure.storage/blob/jazure.storage.blob.js"));

            bundles.Add(new ScriptBundle("~/bundles/sb-admin-2").Include(
                            "~/Scripts/sb-admin-2/metisMenu.js",
                            "~/Scripts/sb-admin-2/sb-admin-2.js"));

            bundles.Add(new ScriptBundle("~/bundles/app").Include(
                            "~/app/common.js",
                            "~/app/utils.js",
                            "~/app/app.js",
                            "~/app/filters.js",
                            "~/app/directives.js",
                            "~/app/controllers/cloudRegionFinderCtrl.js",
                            "~/app/controllers/downloadCtrl.js",
                            "~/app/controllers/latencyCtrl.js",
                            "~/app/controllers/testCtrl.js",
                            "~/app/controllers/uploadCtrl.js",
                            "~/app/controllers/uploadLargeFileCtrl.js"));

            // Set EnableOptimizations to false for debugging. For more information,
            // visit http://go.microsoft.com/fwlink/?LinkId=301862
#if DEBUG
            BundleTable.EnableOptimizations = false;
#else
            BundleTable.EnableOptimizations = true;
#endif
        }
    }
}
