using Microsoft.AspNetCore.Mvc;

namespace AzureSpeed.ApiService.ApiControllers
{
    [Route("")]
    [ApiController]
    public class PingController : ControllerBase
    {
        [HttpGet]
        [Route("")]
        public IActionResult Ping(string ipAddressOrUrl)
        {
            return Ok("ok");
        }
    }
}