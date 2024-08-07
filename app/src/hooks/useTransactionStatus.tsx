import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

export function useTransactionStatus() {
  const transactionSteps = [
    { key: "checking-network", label: "Checking Network" },
    {
      key: "wait-for-user-signature",
      label: "Waiting for User Signature",
    },
    {
      key: "wait-for-block-confirmation",
      label: "Waiting for Block Confirmation",
    },
    { key: "confirmed", label: "Transaction Confirmed" },
  ];
  const accountAbstractionSteps = [
    { key: "creating-user-operation", label: "Creating User Operation" },
    {
      key: "wait-for-user-signature",
      label: "Waiting for User Signature",
    },
    { key: "sending-user-operation", label: "Sending User Operation" },
    {
      key: "wait-for-block-confirmation",
      label: "Waiting for Block Confirmation",
    },
    { key: "confirmed", label: "Transaction Confirmed" },
  ];

  const [steps, setSteps] = useState<{ key: string; label: string }[]>([]);
  const [currentStep, setCurrentStep] = useState("");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [error, setError] = useState("");

  const getStepIcon = (stepKey: string): JSX.Element => {
    const currentStepIndex = steps.findIndex(
      (step) => step.key === currentStep,
    );
    const stepIndex = steps.findIndex((step) => step.key === stepKey);

    if (error && stepIndex >= currentStepIndex) {
      return <XCircle className="w-6 h-6 text-red-500" />;
    }
    if (
      stepIndex < currentStepIndex ||
      (stepIndex === steps.length - 1 && stepKey === currentStep)
    ) {
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    }
    if (stepKey === currentStep) {
      return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
    }
    return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
  };

  return {
    transactionSteps,
    accountAbstractionSteps,
    steps,
    currentStep,
    error,
    transactionHash,
    setSteps,
    setCurrentStep,
    setTransactionHash,
    setError,
    getStepIcon,
  };
}
