# XRAI: A prototypical personal assistant for diagnosing lung conditions from x-rays conditions

## Motivation

Chest X-rays play a critical role in diagnosing thoracic diseases such as pneumonia, lung cancer, and other lung disorders. The interpretation of X-rays requires significant training and expertise, which is often limited in many healthcare settings. Moreover, the interpretation of X-rays can also be time-consuming and may cause delays in treatment. Thus, the development of an accurate and efficient system for the automatic interpretation of chest X-rays could significantly improve the quality and speed of medical care.

## Technical Details

XRAI is a prototype system that utilizes deep learning algorithms to classify and localize thoracic diseases in chest X-ray images. Specifically, we use a Pytorch implementation of CheXNet, a 121-layer convolutional neural network that can detect pneumonia in chest X-rays with a performance exceeding that of radiologists.

XRAI takes a chest X-ray image as input and outputs the probability of each thoracic disease, along with a likelihood map of pathologies. The model is trained on the ChestX-ray14 dataset, which contains over 100,000 frontal view X-ray images with 14 diseases, including pneumonia, emphysema, lung opacity, and cardiomegaly. The trained model is imported into an Electron app, providing a user-friendly interface for healthcare professionals to input X-ray images and receive disease classification results.

## Impact and Social Good

XRAI has the potential to significantly impact healthcare by improving the accuracy and speed of chest X-ray interpretation. The automatic classification of thoracic diseases can reduce the time and effort required for radiologists to interpret X-rays, allowing them to focus on more critical cases. Moreover, XRAI could help healthcare providers in areas with limited access to radiologists or healthcare infrastructure, improving access to healthcare services for remote and underserved communities.

Furthermore, XRAI could reduce healthcare costs associated with manual interpretation of chest X-rays by automating the process. This would lead to faster diagnosis and treatment, potentially reducing hospital stays and preventing unnecessary medical procedures. XRAI could also be used in epidemiological studies to study the prevalence of thoracic diseases in different populations, further contributing to the advancement of medical research.
