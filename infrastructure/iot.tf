resource "aws_iot_topic_rule" "events_rule" {
  name        = "logistics_events_processor_rule"
  description = "Routes MQTT messages from logistics/events to event_processor Lambda"
  enabled     = true
  sql         = "SELECT * FROM 'logistics/events'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = aws_lambda_function.event_processor.arn
  }
}

resource "aws_lambda_permission" "iot_event_processor" {
  statement_id  = "AllowIoTInvokeEventProcessor"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_processor.function_name
  principal     = "iot.amazonaws.com"
  source_arn    = aws_iot_topic_rule.events_rule.arn
}
