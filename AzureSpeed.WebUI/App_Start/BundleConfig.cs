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
                            "~/Content/font-awesome.css",
                            "~/Content/sb-admin-2.css",
                            "~/Content/site.css",
                            "~/Content/azurespeed.css"));

            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                            "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                            "~/Scripts/jquery.validate*"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                            "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                            "~/Scripts/bootstrap.js",
                            "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/flot").Include(
                            "~/Scripts/flot/jquery.flot.js"));

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

            bundles.Add(new ScriptBundle("~/bundles/azurespeed").Include(
                            "~/Scripts/azurespeed/utils.js"));

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
