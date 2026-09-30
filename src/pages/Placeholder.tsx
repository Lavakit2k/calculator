import { Card, Empty } from '../components/ui';

export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      <Card>
        <Empty>Kommt bald.</Empty>
      </Card>
    </>
  );
}
