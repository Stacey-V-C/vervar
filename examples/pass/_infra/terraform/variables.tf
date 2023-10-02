variable "mock_aws_parameter_paths" {
  description = "An example of how paths to AWS parameter store values may be passed via terraform"
  type = object({
    param  = optional(string, "/example/path/param")
    # secret = optional(string, "/example/path/secret")
  })
}