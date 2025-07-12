import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  displayLimit: number;
  onDisplayLimitChange: (limit: number) => void;
}

export default function SearchSection({
  searchQuery,
  onSearchChange,
  displayLimit,
  onDisplayLimitChange,
}: SearchSectionProps) {
  const { t } = useTranslation(['inventory', 'common']);
  return (
    <section className="mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{t('inventory:search.title')}</h3>
            {displayLimit !== -1 && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>{t('inventory:search.showTop')}</span>
                <Select value={displayLimit.toString()} onValueChange={(value) => onDisplayLimitChange(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="-1">{t('inventory:search.all')}</SelectItem>
                  </SelectContent>
                </Select>
                <span>{t('inventory:search.items')}</span>
              </div>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={t('common:placeholders.searchItems')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 py-3"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
