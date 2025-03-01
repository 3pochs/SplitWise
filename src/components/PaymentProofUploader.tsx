
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

type PaymentProofUploaderProps = {
  initialUrl?: string;
  onFileChange: (file: File | null) => void;
};

const PaymentProofUploader = ({
  initialUrl,
  onFileChange,
}: PaymentProofUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Simulate upload process
      setIsUploading(true);
      
      // Create a preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      
      // Simulate upload delay
      setTimeout(() => {
        setIsUploading(false);
        onFileChange(file);
      }, 1000);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onFileChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Proof of Payment</Label>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 px-2 text-destructive"
          >
            <X className="h-4 w-4 mr-1" /> Remove
          </Button>
        )}
      </div>

      {previewUrl ? (
        <div className="relative rounded-md border overflow-hidden">
          <img
            src={previewUrl}
            alt="Payment proof"
            className="w-full h-auto max-h-48 object-contain"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-md p-6 bg-accent/20">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a receipt or proof of payment
              </p>
              <Input
                type="file"
                id="proof"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label
                htmlFor="proof"
                className="cursor-pointer"
              >
                <Button type="button" size="sm">
                  <Upload className="h-4 w-4 mr-1" /> Choose file
                </Button>
              </Label>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentProofUploader;
