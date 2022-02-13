# Cost estimation

You are responsible for the cost of the AWS services used while running this solution.

## Assumptions

| General                                   |     |
| ----------------------------------------- | --- |
| Avg clicks/edits per model creation       | 40  |
| DynamoDB entry size (KB) / model training | 40  |
| Processing Step Docker image size (GB)    | 0.8 |
| Avg Lambda Duration (ms)/call             | 350 |
| Lambda Avg Memory (MB)                    | 256 |

| Machine Learning                        |              |
| --------------------------------------- | ------------ |
| _Processing (Feature Engineering Step)_ |              |
| Instance Type                           | ml.m5.xlarge |
| Number instances / Job                  | 1            |
| Avg Mins / Job                          | 10           |
| Storage (MB) / Job                      | 200          |
| &nbsp;                                  |              |
| _Model Training Step_                   |              |
| Instance Type                           | ml.m5.xlarge |
| Number of instances                     | 1            |
| Avg Mins / Job                          | 12           |
| Storage (MB) / Job                      | 100          |
| &nbsp;                                  |              |
| _Inference (Endpoints)_                 |              |
| Instance Type                           | ml.m5.large  |
| Number of instances                     | 1            |
| Avg Mins Active / Endpoint              | 60           |
| Avg Model Size (MB)                     | 5            |
| &nbsp;                                  |              |
| _Pipeline Events_                       |              |
| Avg Number of Events / Job              | 21           |
| &nbsp;                                  |              |
| _Model Training_                        |              |
| Total Number of Model Trainings/mo      | 2000         |

## Cost

| Metadata and Model training artifacts | Cost       |          |
| ------------------------------------- | ---------- | -------- |
| S3                                    | $14.65     | _586GB_  |
| DynamoDB                              | $0.285     | _0.08GB_ |
| Total                                 | $14.94     |          |
| Per Model                             | $0.0074675 |          |

| Feature Engineering Step             | Cost            |                   |
| ------------------------------------ | --------------- | ----------------- |
| Amazon ECR (Processing Docker Image) | $0.08           | _1 GB/MO_         |
| ML Storage                           | $46.92          | _391GB_           |
| Processing Job                       | $96.00          | 333 Hours         |
| &nbsp;                               |                 |                   |
| _Model Training Step_                |                 |                   |
| SageMaker Training Jobs              | $115.20         | 400 Hours         |
| ML Storage                           | $32.93          | 195GB             |
| Event Triggers                       | $0.04           | 42,000 Events     |
| Lambda Triggers From Events          | $0.07           | 42,000 Executions |
| &nbsp;                               |                 |                   |
| _Inference_                          |                 |                   |
| Model Endpoints Active               | $288.00         | 2,000 Hours       |
| ML Storage                           | $1.68           | 10 GB             |
| &nbsp;                               |                 |                   |
| &nbsp;                               |                 |                   |
| Total $                              | **$289.79**     |                   |
| Per Model $                          | **$0.14489583** |                   |

| Web UI                   | Cost  |                   |
| ------------------------ | ----- | ----------------- |
| API Gateway              | $0.34 | 80,000 Requests   |
| Lambda (handle requests) | $0.13 | 80,000 Executions |
| S3 Hosting               | $0.43 |                   |
| Total                    | $0.56 | $ 0.56            |

## Total

| Monthly cost        | Fixed       | Variable   | Subtotal   |
| ------------------- | ----------- | ---------- | ---------- |
| Monthly Grand Total | $15         | $291       | **$306**   |
| Per Model           | $ 0.0075000 | $0.1455000 | $0.1530000 |

| Annual cost        | Fixed       | Variable   | Subtotal   |
| ------------------ | ----------- | ---------- | ---------- |
| Annual Grand Total | $80         | $3,492     | **$3,672** |
| Per Model          | $ 0.0900000 | $1.7460000 | $1.8360000 |

---
<br/>
<br/>

> IMPORTANT: **Prices are subject to change. For full details, refer to the pricing webpage for each AWS service you will be using in this solution.**